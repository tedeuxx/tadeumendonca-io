#!/bin/bash
bucket_name="tadeumen-terraform-backend"
encrypt_config="{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}"
region="us-east-1"
terraform_user="terraform_be_user"

to_log(){
    msg=$1
    timestamp=$(date '+%Y%m%d%H%M%S')
    echo "[${timestamp}] $1"
}

destroy_bucket(){
    aws s3 rb "s3://${bucket_name}" --force
    if [[ $? -ne 0 ]] ; then
        to_log "Error Destroying Bucket : ${bucket_name}"
        exit 1
    else
        to_log "Success Destroying Bucket : ${bucket_name}"
    fi
}

destroy_user(){
    # detach user policies
	policies_list=$(aws iam list-attached-user-policies --user-name "$terraform_user" --query 'AttachedPolicies[*].PolicyArn' | jq '. | join(" ")') 
	for policy in ${policies_list}; do
        policy=$(echo ${policy} | sed "s/\"//g")
        aws iam detach-user-policy --user-name "$terraform_user" --policy-arn ${policy}
        if [[ $? -ne 0 ]] ; then
            to_log "Error Detaching User Policy ${policy} from ${terraform_user}"
            exit 1
        else
            to_log "Success Detaching User Policy ${policy} from ${terraform_user}"
        fi
    done

    aws iam delete-user --user-name "${terraform_user}"
    if [[ $? -ne 0 ]] ; then
        to_log "Error Destroying Bucket : ${terraform_user}"
        exit 1
    else
        to_log "Success Destroying Bucket : ${terraform_user}"
    fi
}


# Destroy Bucket
#destroy_bucket
destroy_user